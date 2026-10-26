import type { SlotCore } from '@deepseek-ai/dsh-client-ui-slots'

declare module '@deepseek-ai/cordis' {
  interface Context {
    slots: SlotCore
  }
}
