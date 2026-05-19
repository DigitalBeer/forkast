import { ShoppingListPage } from '@/components/shopping/ShoppingListPage';
import { PaperPage } from '@/components/layout/PaperPage';

interface PageProps {
    params: { id: string };
}

export default function ShoppingListRoute({ params }: PageProps) {
    return <PaperPage><ShoppingListPage mealPlanId={params.id} /></PaperPage>;
}
