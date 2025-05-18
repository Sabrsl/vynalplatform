/**
 * Composant pour injecter des données schema.org structurées dans le head
 */
export default function SchemaOrg({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
} 