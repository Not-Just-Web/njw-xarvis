import {
  type RuntimeMessage,
  type SendChatMessage,
  type SetActiveProviderMessage
} from '../../shared/types/runtime-messages';
import { getActiveProvider, sendWithActiveProvider, setActiveProvider } from './provider-router';

type RuntimeResponse = {
  type: 'response';
  payload: Record<string, unknown>;
};

const toRuntimeResponse = (payload: Record<string, unknown>): RuntimeResponse => ({
  type: 'response',
  payload
});

const handleSetActiveProvider = (message: SetActiveProviderMessage): RuntimeResponse => {
  const providerId = setActiveProvider(message.payload.providerId);
  return toRuntimeResponse({ ok: true, providerId });
};

const handleSendChat = async (message: SendChatMessage): Promise<RuntimeResponse> => {
  const response = await sendWithActiveProvider({
    sessionId: message.payload.sessionId,
    messages: [{ role: 'user', content: message.payload.prompt }],
    contextEvents: message.payload.context.map((item) => item.label)
  });

  return toRuntimeResponse({
    ok: true,
    providerId: getActiveProvider(),
    text: response.text,
    model: response.model
  });
};

export const routeRuntimeMessage = async (message: RuntimeMessage): Promise<RuntimeResponse> => {
  switch (message.type) {
    case 'provider.setActive':
      return handleSetActiveProvider(message);

    case 'provider.getActive':
      return toRuntimeResponse({ ok: true, providerId: getActiveProvider() });

    case 'chat.send':
      return handleSendChat(message);

    case 'chat.healthCheck':
      return toRuntimeResponse({ ok: true, providerId: getActiveProvider(), status: 'healthy' });

    default:
      return toRuntimeResponse({ ok: false, error: 'Unsupported runtime message' });
  }
};
