import api from './api';

export interface AssistantChatResult {
  reply: string;
  source: string;
}

const assistantService = {
  async chat(message: string): Promise<AssistantChatResult> {
    const res = await api.post<{ data: AssistantChatResult }>('/assistant/chat', { message });
    return res.data.data;
  },
};

export default assistantService;
