import { Linking } from 'react-native';
import { TERMS_URL } from '@/api/config';

// Abre o documento de termos no navegador do aparelho. Devolve false se não
// abrir (sem navegador, sem internet, erro): quem chama mostra uma mensagem
// discreta, sem impedir nada.
export async function openTermsDocument(): Promise<boolean> {
  try {
    await Linking.openURL(TERMS_URL);
    return true;
  } catch {
    return false;
  }
}

export const TERMS_OPEN_ERROR_MESSAGE = 'Não foi possível abrir o documento. Tente novamente com internet.';
