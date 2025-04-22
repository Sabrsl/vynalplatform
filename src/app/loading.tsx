import { Loader } from "@/components/ui/loader";

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <Loader size="lg" variant="primary" showText={true} />
    </div>
  );
} 