import { useNavigate } from 'react-router-dom';

import { Page, TopBar } from '@/components/Layout';
import { Button, Card, EmptyState, IconButton } from '@/components/ui';
import { PetCard } from '@/features/pets/components/PetCard';
import { usePets } from '@/features/pets/hooks';
import { t } from '@/i18n/strings';

export default function Pets() {
  const navigate = useNavigate();
  const { data: pets, isLoading, isError, refetch } = usePets();
  const add = () => navigate('/pets/novo');
  return (
    <>
      <TopBar title={t.pets.title} right={<IconButton icon="plus" label={t.pets.add} onClick={add} />} />
      <Page>
        {isLoading ? (
          <div className="flex flex-col gap-3" role="status" aria-label={t.auth.loading}>
            {[0, 1].map((i) => <div key={i} className="h-[170px] animate-pulse rounded-[24px] bg-surfaceAlt" />)}
          </div>
        ) : isError ? (
          <Card className="text-center">
            <p className="mb-3 text-textMuted">{t.pets.loadError}</p>
            <Button label={t.admin.retry} onClick={() => void refetch()} />
          </Card>
        ) : !pets?.length ? (
          <EmptyState icon="paw" title={t.pets.emptyTitle} text={t.pets.emptyText} actionLabel={t.pets.add} onAction={add} />
        ) : (
          <>
            <div className="flex flex-col gap-3">{pets.map((p) => <PetCard key={p.id} pet={p} />)}</div>
            <Button label={t.pets.another} variant="ghost" icon="plus" block onClick={add} />
          </>
        )}
      </Page>
    </>
  );
}
