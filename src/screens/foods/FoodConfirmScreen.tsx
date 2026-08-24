import React from 'react';
import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

// TODO: UC-07 — exibida só quando a busca retorna resultado ambíguo
// (ex.: "Frango": peito grelhado / cozido / sobrecoxa).
export function FoodConfirmScreen() {
  return <ScreenPlaceholder title="Confirmar alimento" />;
}
