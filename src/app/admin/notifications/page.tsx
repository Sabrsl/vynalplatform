import { Metadata } from "next";
import { AdminNotificationsPageClient } from ".";

export const metadata: Metadata = {
  title: "Administration des notifications | Vynal",
  description: "Gérez les notifications et les emails de la plateforme",
};

export default function AdminNotificationsPage() {
  return <AdminNotificationsPageClient />;
} 