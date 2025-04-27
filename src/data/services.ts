import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ActiveService, Service } from '@/types/service';
import { Database } from '@/types/database';

export async function getActiveServices(userId: string): Promise<ActiveService[]> {
  const supabase = createClientComponentClient<Database>();
  
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        bookings (id, created_at)
      `)
      .eq('freelance_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching active services:', error);
      throw error;
    }

    // Transform services to match ActiveService interface
    return (services || []).map((service) => {
      const bookings = service.bookings as unknown as Array<{ created_at: string }>;
      return {
        ...service,
        bookings_count: bookings?.length || 0,
        last_booked_at: bookings?.length > 0 
          ? bookings[bookings.length - 1]?.created_at 
          : null
      };
    });
  } catch (error) {
    console.error('Failed to fetch active services:', error);
    throw error;
  }
}

export async function getServiceById(serviceId: string): Promise<Service | null> {
  const supabase = createClientComponentClient<Database>();
  
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error) {
      console.error('Error fetching service by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch service by ID:', error);
    return null;
  }
} 