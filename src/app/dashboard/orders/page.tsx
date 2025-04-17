"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderCard } from "@/components/orders/OrderCard";
import { useAuth } from "@/hooks/useAuth";
import { Search, Filter, ShoppingBag } from "lucide-react";

// Type definition for order status
type OrderStatus = "pending" | "in_progress" | "completed" | "delivered" | "revision_requested" | "cancelled";

// Type for tab values
type TabValue = OrderStatus | "all";

// Type definition for order objects
type Order = {
  id: string;
  created_at: string;
  status: OrderStatus;
  service: {
    id: string;
    title: string;
    price: number;
  };
  freelance: {
    id: string;
    username: string;
    full_name: string;
  };
  client: {
    id: string;
    username: string;
    full_name: string;
  };
  is_client_view: boolean;
};

// Données fictives pour la démo
const MOCK_ORDERS_CLIENT: Order[] = [
  {
    id: "order-1",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "in_progress" as const,
    service: {
      id: "service-1",
      title: "Création d'un logo professionnel",
      price: 150,
    },
    freelance: {
      id: "freelance-1",
      username: "designpro",
      full_name: "Marie Dupont",
    },
    client: {
      id: "client-1",
      username: "clientuser",
      full_name: "Jean Martin",
    },
    is_client_view: true,
  },
  {
    id: "order-2",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "delivered" as const,
    service: {
      id: "service-2",
      title: "Rédaction d'un article SEO optimisé",
      price: 85,
    },
    freelance: {
      id: "freelance-2",
      username: "contentwizard",
      full_name: "Lucas Bernard",
    },
    client: {
      id: "client-1",
      username: "clientuser",
      full_name: "Jean Martin",
    },
    is_client_view: true,
  },
  {
    id: "order-3",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed" as const,
    service: {
      id: "service-3",
      title: "Développement d'une landing page responsive",
      price: 350,
    },
    freelance: {
      id: "freelance-3",
      username: "webdev",
      full_name: "Sophie Moreau",
    },
    client: {
      id: "client-1",
      username: "clientuser",
      full_name: "Jean Martin",
    },
    is_client_view: true,
  },
];

const MOCK_ORDERS_FREELANCE: Order[] = [
  {
    id: "order-4",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending" as const,
    service: {
      id: "service-4",
      title: "Design d'interface pour application mobile",
      price: 250,
    },
    freelance: {
      id: "freelance-1",
      username: "designpro",
      full_name: "Marie Dupont",
    },
    client: {
      id: "client-2",
      username: "entreprise_xyz",
      full_name: "Entreprise XYZ",
    },
    is_client_view: false,
  },
  {
    id: "order-5",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "in_progress" as const,
    service: {
      id: "service-5",
      title: "Création d'identité visuelle complète",
      price: 500,
    },
    freelance: {
      id: "freelance-1",
      username: "designpro",
      full_name: "Marie Dupont",
    },
    client: {
      id: "client-3",
      username: "startup_abc",
      full_name: "Startup ABC",
    },
    is_client_view: false,
  },
  {
    id: "order-6",
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: "revision_requested" as const,
    service: {
      id: "service-6",
      title: "Conception de mascotte de marque",
      price: 300,
    },
    freelance: {
      id: "freelance-1",
      username: "designpro",
      full_name: "Marie Dupont",
    },
    client: {
      id: "client-4",
      username: "boutique_locale",
      full_name: "Boutique Locale",
    },
    is_client_view: false,
  },
];

export default function OrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const isFreelance = user?.user_metadata?.role === "freelance";
  
  // Utiliser les données appropriées selon le rôle de l'utilisateur
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(
    isFreelance ? MOCK_ORDERS_FREELANCE : MOCK_ORDERS_CLIENT
  );

  // Dans une vraie application, vous récupéreriez les commandes depuis l'API
  useEffect(() => {
    // Filtrer par statut
    let filtered: Order[] = isFreelance ? MOCK_ORDERS_FREELANCE : MOCK_ORDERS_CLIENT;
    
    if (activeTab !== "all") {
      filtered = filtered.filter((order) => order.status === activeTab) as Order[];
    }
    
    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => 
        order.service.title.toLowerCase().includes(query) ||
        (isFreelance ? 
          order.client.full_name?.toLowerCase().includes(query) : 
          order.freelance.full_name?.toLowerCase().includes(query))
      ) as Order[];
    }
    
    setFilteredOrders(filtered);
  }, [activeTab, searchQuery, isFreelance]);

  return (
    <div className="container max-w-5xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isFreelance ? "Commandes reçues" : "Mes commandes"}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher une commande..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-slate-500" />
              <span className="text-sm font-medium">Filtrer</span>
            </div>
            <Button size="sm" variant="outline">
              Appliquer
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as TabValue)}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="in_progress">En cours</TabsTrigger>
          <TabsTrigger value="delivered">Livrées</TabsTrigger>
          <TabsTrigger value="revision_requested">Révision</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="m-0">
          {filteredOrders.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={{
                    ...order,
                    is_client_view: !isFreelance
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">Aucune commande trouvée</h3>
              <p className="text-sm text-slate-500 max-w-md mb-6">
                {isFreelance 
                  ? "Vous n'avez pas encore reçu de commandes correspondant à ces critères."
                  : "Vous n'avez pas encore passé de commandes correspondant à ces critères."}
              </p>
              {!isFreelance && (
                <Button>Découvrir des services</Button>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Les autres TabsContent sont identiques, mais avec des filtres différents qui sont déjà appliqués dans le useEffect */}
        <TabsContent value="pending" className="m-0">
          {/* Le contenu est géré par le useEffect qui filtre les commandes */}
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={{
                  ...order,
                  is_client_view: !isFreelance
                }}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="in_progress" className="m-0">
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={{
                  ...order,
                  is_client_view: !isFreelance
                }}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="delivered" className="m-0">
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={{
                  ...order,
                  is_client_view: !isFreelance
                }}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="revision_requested" className="m-0">
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={{
                  ...order,
                  is_client_view: !isFreelance
                }}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="completed" className="m-0">
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={{
                  ...order,
                  is_client_view: !isFreelance
                }}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 