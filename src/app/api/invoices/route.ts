import { NextRequest, NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { logSecurityEvent } from '@/lib/security/audit';
import { stripe } from '@/lib/stripe/server';
import PDFDocument from 'pdfkit';

/**
 * API pour générer une facture PDF pour un paiement
 * 
 * Route: GET /api/invoices/[paymentId]
 * Cette API requiert une authentification
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  const clientIp = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const paymentId = params.paymentId;
  
  try {
    // Vérifier l'authentification
    const supabase = createClientComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Vérifier si l'utilisateur est authentifié
    if (!session?.user) {
      // Journaliser la tentative d'accès non autorisé
      await logSecurityEvent({
        type: 'security_violation',
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
        severity: 'high',
        details: {
          message: "Tentative d'accès à une facture sans authentification",
          paymentId
        }
      });
      
      return NextResponse.json(
        { error: 'Non autorisé. Authentification requise.' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Récupérer les informations du paiement
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        service:service_id (
          title,
          description
        )
      `)
      .eq('id', paymentId)
      .eq('user_id', userId)
      .single();
    
    if (paymentError || !payment) {
      // Journaliser l'erreur ou la tentative d'accès à un paiement inexistant
      await logSecurityEvent({
        type: 'security_violation',
        userId,
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
        severity: 'medium',
        details: {
          message: "Tentative d'accès à un paiement inexistant ou n'appartenant pas à l'utilisateur",
          paymentId,
          error: paymentError?.message
        }
      });
      
      return NextResponse.json(
        { error: 'Paiement introuvable ou non autorisé' },
        { status: 404 }
      );
    }
    
    // Vérifier si le paiement est complété
    if (payment.status !== 'completed') {
      return NextResponse.json(
        { error: 'La facture n\'est disponible que pour les paiements complétés' },
        { status: 400 }
      );
    }
    
    // Récupérer les détails de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, address, phone')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Erreur lors de la récupération du profil:', profileError);
    }
    
    // Récupérer les détails du paiement via Stripe si nécessaire
    let stripePaymentDetails = null;
    try {
      if (payment.payment_intent_id) {
        stripePaymentDetails = await stripe.paymentIntents.retrieve(payment.payment_intent_id);
      }
    } catch (stripeError) {
      console.error('Erreur lors de la récupération des détails Stripe:', stripeError);
    }
    
    // Générer la facture PDF
    const pdfBuffer = await generateInvoicePDF({
      payment,
      profile: profile || null,
      stripePaymentDetails
    });
    
    // Journaliser le téléchargement de la facture
    await logSecurityEvent({
      type: 'sensitive_data_access',
      userId,
      ipAddress: clientIp as string,
      userAgent: userAgent as string,
      severity: 'low',
      details: {
        action: "download_invoice",
        paymentId
      }
    });
    
    // Renvoyer le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${paymentId}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('Erreur lors de la génération de la facture:', error);
    
    // Journaliser l'erreur
    await logSecurityEvent({
      type: 'security_violation',
      ipAddress: clientIp as string,
      userAgent: userAgent as string,
      severity: 'medium',
      details: {
        message: "Erreur lors de la génération d'une facture",
        paymentId,
        error: error.message
      }
    });
    
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la génération de la facture' },
      { status: 500 }
    );
  }
}

/**
 * Génère un PDF de facture
 * 
 * @param params Paramètres pour la génération de la facture
 * @returns Buffer contenant le PDF
 */
async function generateInvoicePDF(params: {
  payment: any;
  profile: any;
  stripePaymentDetails: any;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const { payment, profile, stripePaymentDetails } = params;
      
      // Créer un nouveau document PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Buffer pour stocker le PDF
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Numéro de facture et date
      const invoiceNumber = `INV-${payment.id.split('-')[0].toUpperCase()}`;
      const invoiceDate = new Date(payment.created_at).toLocaleDateString('fr-FR');
      
      // Titre
      doc.fontSize(20).text('FACTURE', { align: 'center' });
      doc.moveDown();
      
      // En-tête
      doc.fontSize(12).text('Vynal Platform', { align: 'left' });
      doc.fontSize(10)
        .text('SIRET: 123 456 789 00012')
        .text('123 Avenue des Champs-Élysées')
        .text('75008 Paris, France')
        .text('contact@vynal.com');
      
      doc.moveDown();
      
      // Informations du client
      doc.fontSize(12).text('Facturé à:', { align: 'left' });
      doc.fontSize(10)
        .text(profile?.full_name || payment.metadata?.userName || 'Client')
        .text(profile?.email || payment.metadata?.userEmail || '')
        .text(profile?.address || '')
        .text(profile?.phone || '');
      
      doc.moveDown();
      
      // Informations de la facture
      doc.fontSize(12).text('Informations de la facture:', { align: 'left' });
      doc.fontSize(10)
        .text(`Numéro de facture: ${invoiceNumber}`)
        .text(`Date de facturation: ${invoiceDate}`)
        .text(`Méthode de paiement: ${payment.payment_method === 'card' ? 'Carte bancaire' : payment.payment_method}`);
      
      if (stripePaymentDetails?.charges?.data[0]?.payment_method_details?.card) {
        const card = stripePaymentDetails.charges.data[0].payment_method_details.card;
        doc.text(`Carte: **** **** **** ${card.last4} (${card.brand})`);
      }
      
      doc.moveDown(2);
      
      // Table d'articles
      const serviceName = payment.service?.title || payment.metadata?.serviceName || 'Service';
      const serviceDescription = payment.service?.description || payment.metadata?.serviceDescription || 'Description du service';
      
      // En-tête de la table
      doc.fontSize(10).text('Description', 50, doc.y, { width: 250 });
      doc.text('Quantité', 300, doc.y, { width: 90, align: 'center' });
      doc.text('Prix', 390, doc.y, { width: 90, align: 'right' });
      doc.text('Total', 480, doc.y, { width: 90, align: 'right' });
      
      // Ligne séparatrice
      doc.moveDown(0.5);
      doc.lineCap('butt')
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown(0.5);
      
      // Ligne article
      doc.fontSize(10).text(serviceName, 50, doc.y, { width: 250 });
      doc.fontSize(8).text(serviceDescription, 50, doc.y + 15, { width: 250 });
      doc.fontSize(10).text('1', 300, doc.y, { width: 90, align: 'center' });
      doc.text(`${payment.amount.toFixed(2)} €`, 390, doc.y, { width: 90, align: 'right' });
      doc.text(`${payment.amount.toFixed(2)} €`, 480, doc.y, { width: 90, align: 'right' });
      
      // Ligne séparatrice
      doc.moveDown(2);
      doc.lineCap('butt')
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown(0.5);
      
      // Total
      doc.fontSize(10).text('Total HT:', 390, doc.y, { width: 90 });
      doc.text(`${(payment.amount / 1.2).toFixed(2)} €`, 480, doc.y, { width: 90, align: 'right' });
      doc.moveDown(0.5);
      
      doc.fontSize(10).text('TVA (20%):', 390, doc.y, { width: 90 });
      doc.text(`${(payment.amount - payment.amount / 1.2).toFixed(2)} €`, 480, doc.y, { width: 90, align: 'right' });
      doc.moveDown(0.5);
      
      doc.fontSize(12).text('Total TTC:', 390, doc.y, { width: 90 });
      doc.text(`${payment.amount.toFixed(2)} €`, 480, doc.y, { width: 90, align: 'right' });
      
      doc.moveDown(2);
      
      // Pied de page
      doc.fontSize(10).text('Merci pour votre confiance!', { align: 'center' });
      doc.moveDown();
      doc.fontSize(8).text('Cette facture a été générée électroniquement et est valide sans signature.', { align: 'center' });
      
      // Finaliser le document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}