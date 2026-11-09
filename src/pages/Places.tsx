import { useState } from 'react';

import { Page, TopBar } from '@/components/Layout';
import { Button, Card, Hero } from '@/components/ui';
import { t } from '@/i18n/strings';
import { formatCep } from '@/utils/cep';
import { comingSoon } from '@/utils/comingSoon';

export default function Places() {
  const [cep, setCep] = useState('');
  return (
    <>
      <TopBar title={t.places.title} />
      <Page>
        <Hero title={t.places.heroTitle} text={t.places.heroText} />
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              comingSoon('A busca de locais pelo CEP');
            }}
          >
            <label htmlFor="cep" className="mb-[6px] block text-small font-extrabold text-heading">
              {t.places.cepLabel}
            </label>
            <input
              id="cep"
              inputMode="numeric"
              autoComplete="postal-code"
              value={cep}
              onChange={(e) => setCep(formatCep(e.target.value))}
              placeholder={t.places.cepPlaceholder}
              maxLength={9}
              className="mb-[14px] min-h-[48px] w-full rounded-md border-0 bg-surface px-[14px] text-body shadow-[inset_0_0_0_1.5px_theme(colors.line)] outline-none focus:shadow-[inset_0_0_0_2px_theme(colors.primary)] focus-visible:outline-none"
            />
            <Button type="submit" label={t.places.search} icon="pin" block />
          </form>
        </Card>
      </Page>
    </>
  );
}
