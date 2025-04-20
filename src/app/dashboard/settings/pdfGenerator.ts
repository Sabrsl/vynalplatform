// Types pour le générateur de PDF
export interface ServiceData {
  title: string;
  description: string;
  price: number;
  delivery_time: number;
}

export interface OrderData {
  service_title?: string;
  service_id?: string;
  created_at: string;
  status: 'completed' | 'in_progress' | 'cancelled' | string;
  amount: number;
}

export interface ReviewData {
  rating: number;
  comment: string;
  reviewer_name?: string;
  created_at: string;
}

/**
 * Génère le HTML pour les services d'un freelance dans le PDF
 * @param services Liste des services à afficher
 * @returns Le HTML formaté pour les services
 */
export const generateServicesSection = (services: ServiceData[]): string => {
  if (!services || services.length === 0) return '';

  return `
  <div style="margin-bottom: 10mm; padding: 5mm; background-color: #f9f9f9; border-radius: 3mm;">
    <h2 style="font-size: 14pt; margin: 0 0 3mm; color: #7656ED;">Services proposés</h2>
    <div style="display: flex; flex-direction: column; gap: 3mm;">
      ${services.map((service: ServiceData) => `
        <div style="padding: 3mm; background-color: white; border-radius: 2mm; border-left: 3px solid #7656ED;">
          <h3 style="font-size: 12pt; margin: 0 0 2mm; color: #333;">${service.title}</h3>
          <p style="margin: 0 0 2mm; font-size: 9pt; color: #666;">${service.description.substring(0, 100)}${service.description.length > 100 ? '...' : ''}</p>
          <div style="display: flex; justify-content: space-between; font-size: 9pt;">
            <span><strong>Prix :</strong> ${service.price}€</span>
            <span><strong>Délai :</strong> ${service.delivery_time} jour${service.delivery_time > 1 ? 's' : ''}</span>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  `;
};

/**
 * Génère le HTML pour la section des compétences dans le PDF
 * @param skills Liste des compétences à afficher
 * @returns Le HTML formaté pour les compétences
 */
export const generateSkillsSection = (skills: string[]): string => {
  if (!skills || !Array.isArray(skills) || skills.length === 0) return '';

  return `
  <div style="margin-bottom: 10mm; padding: 5mm; background-color: #f9f9f9; border-radius: 3mm;">
    <h2 style="font-size: 14pt; margin: 0 0 3mm; color: #7656ED;">Compétences</h2>
    <div style="display: flex; flex-wrap: wrap; gap: 2mm;">
      ${skills.map((skill: string) => 
        `<span style="padding: 1mm 3mm; background-color: #7656ED20; border-radius: 2mm; font-size: 9pt;">${skill}</span>`
      ).join('')}
    </div>
  </div>
  `;
};

/**
 * Génère le HTML pour la section des commandes dans le PDF
 * @param orders Liste des commandes à afficher
 * @returns Le HTML formaté pour les commandes
 */
export const generateOrdersSection = (orders: OrderData[]): string => {
  if (!orders || orders.length === 0) return '';

  return `
  <div style="margin-bottom: 10mm; padding: 5mm; background-color: #f9f9f9; border-radius: 3mm;">
    <h2 style="font-size: 14pt; margin: 0 0 3mm; color: #7656ED;">Commandes récentes</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
      <thead>
        <tr style="border-bottom: 1px solid #ddd; text-align: left;">
          <th style="padding: 2mm;">Service</th>
          <th style="padding: 2mm;">Date</th>
          <th style="padding: 2mm;">Statut</th>
          <th style="padding: 2mm;">Montant</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map((order: OrderData) => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 2mm;">${order.service_title || 'Service #' + order.service_id}</td>
            <td style="padding: 2mm;">${new Date(order.created_at).toLocaleDateString()}</td>
            <td style="padding: 2mm;">
              <span style="
                padding: 1mm 2mm; 
                border-radius: 2mm; 
                font-size: 8pt;
                background-color: ${
                  order.status === 'completed' ? '#4CAF5020' : 
                  order.status === 'in_progress' ? '#2196F320' : 
                  order.status === 'cancelled' ? '#F4433620' : '#9E9E9E20'
                };
                color: ${
                  order.status === 'completed' ? '#4CAF50' : 
                  order.status === 'in_progress' ? '#2196F3' : 
                  order.status === 'cancelled' ? '#F44336' : '#9E9E9E'
                };
              ">
                ${
                  order.status === 'completed' ? 'Terminé' : 
                  order.status === 'in_progress' ? 'En cours' : 
                  order.status === 'cancelled' ? 'Annulé' : 'En attente'
                }
              </span>
            </td>
            <td style="padding: 2mm;">${order.amount}€</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  `;
};

/**
 * Génère le HTML pour la section des avis dans le PDF
 * @param reviews Liste des avis à afficher
 * @returns Le HTML formaté pour les avis
 */
export const generateReviewsSection = (reviews: ReviewData[]): string => {
  if (!reviews || reviews.length === 0) return '';

  return `
  <div style="margin-bottom: 10mm; padding: 5mm; background-color: #f9f9f9; border-radius: 3mm;">
    <h2 style="font-size: 14pt; margin: 0 0 3mm; color: #7656ED;">Avis clients</h2>
    <div style="display: flex; flex-direction: column; gap: 3mm;">
      ${reviews.map((review: ReviewData) => `
        <div style="padding: 3mm; background-color: white; border-radius: 2mm; position: relative;">
          <div style="position: absolute; top: 3mm; right: 3mm; font-size: 10pt;">
            ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
          </div>
          <p style="margin: 0 0 2mm; font-size: 9pt; font-style: italic; color: #555;">"${review.comment}"</p>
          <p style="margin: 0; font-size: 8pt; color: #999; text-align: right;">
            ${review.reviewer_name || 'Anonyme'} - ${new Date(review.created_at).toLocaleDateString()}
          </p>
        </div>
      `).join('')}
    </div>
  </div>
  `;
}; 