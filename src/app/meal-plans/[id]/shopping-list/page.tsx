import { ShoppingListPage } from '@/components/shopping/ShoppingListPage';

interface PageProps {
    params: { id: string };
}

export default function ShoppingListRoute({ params }: PageProps) {
    return <ShoppingListPage mealPlanId={params.id} />;
}
