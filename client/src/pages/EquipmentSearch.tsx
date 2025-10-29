import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Upload, MessageSquare, Loader2, Trash2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function EquipmentSearch() {
  const { user, loading: authLoading } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const uploadMutation = trpc.equipment.uploadExcel.useMutation({
    onSuccess: (data) => {
      toast.success(`Ficheiro processado com sucesso! ${data.count} equipamentos importados.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploading(false);
    },
    onError: (error) => {
      toast.error(`Erro ao processar ficheiro: ${error.message}`);
      setUploading(false);
    },
  });

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      chatHistoryQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
    },
  });

  const chatHistoryQuery = trpc.chat.getHistory.useQuery(undefined, {
    enabled: !!user,
  });

  // Scroll automático quando o histórico muda
  useEffect(() => {
    if (chatHistoryQuery.data && chatHistoryQuery.data.length > 0) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [chatHistoryQuery.data]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsm") && !file.name.endsWith(".xlsx")) {
      toast.error("Por favor, selecione um ficheiro Excel (.xlsx ou .xlsm)");
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );

        uploadMutation.mutate({
          fileContent: base64,
          replaceExisting: true,
        });
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      toast.error("Erro ao ler ficheiro");
      setUploading(false);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({ message: message.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearHistoryMutation = trpc.chat.clearHistory.useMutation({
    onSuccess: () => {
      chatHistoryQuery.refetch();
      toast.success("Histórico limpo com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao limpar histórico: ${error.message}`);
    },
  });

  const handleClearHistory = async () => {
    if (!confirm("Tem a certeza que deseja limpar todo o histórico de conversas?")) {
      return;
    }
    clearHistoryMutation.mutate();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Pesquisa de Equipamentos
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Faça upload do ficheiro Excel e pesquise equipamentos através do chatbot
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upload Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Ficheiro
              </CardTitle>
              <CardDescription>
                Carregue o ficheiro Excel com os equipamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">Ficheiro Excel (.xlsm ou .xlsx)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".xlsx,.xlsm"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="mt-2"
                  />
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A processar ficheiro...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Section */}
          <Card className="lg:col-span-2 flex flex-col" style={{ height: "600px" }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Chatbot de Pesquisa
                  </CardTitle>
                  <CardDescription>
                    Pergunte sobre equipamentos e obtenha informações detalhadas
                  </CardDescription>
                </div>
                {chatHistoryQuery.data && chatHistoryQuery.data.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearHistory}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Limpar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              {/* Chat History */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2"
              >
                {chatHistoryQuery.isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : chatHistoryQuery.data && chatHistoryQuery.data.length > 0 ? (
                  <>
                    {chatHistoryQuery.data.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            <Streamdown>{msg.content}</Streamdown>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Comece a conversa fazendo uma pergunta sobre equipamentos</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Preciso de um monitor Dell..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Enviar"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
