import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bot, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "../ui/input";
import { supabase } from "@/integrations/supabase/client";

interface ChatStep {
  id: string;
  question: string;
  options: { value: string; label: string }[];
  multiSelect?: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  options?: { value: string; label: string }[];
  currentStep?: number;
  isContinueButton?: boolean;
  selectionStep?: number; // Add this line
}

const chatSteps: ChatStep[] = [
  {
    id: "favorite-genres",
    question:
      "Quais tipos de filmes ou séries você mais gosta de assistir? Selecione quantos quiser",
    options: [
      { value: "action", label: "Ação" },
      { value: "comedy", label: "Comédia" },
      { value: "romance", label: "Romance" },
      { value: "horror", label: "Terror" },
      { value: "psychological", label: "Drama Psicológico" },
      { value: "fantasy", label: "Fantasia" },
      { value: "scifi", label: "Ficção Científica" },
      { value: "mystery", label: "Mistério" },
      { value: "documentary", label: "Documentário" },
      { value: "family", label: "Família/Infantil" },
    ],
    multiSelect: true,
  },
  {
    id: "content-preference",
    question: "Você prefere?",
    options: [
      { value: "movies", label: "Filmes" },
      { value: "series", label: "Séries" },
      { value: "both", label: "Tanto faz" },
    ],
  },
  {
    id: "watch-duration",
    question: "Por quanto tempo você geralmente assiste?",
    options: [
      { value: "30min", label: "Menos de 30 minutos" },
      { value: "1h", label: "Até uma hora" },
      { value: "1h+", label: "Mais de uma hora" },
      { value: "exploring", label: "Estou só explorando" },
    ],
  },
  {
    id: "watch-time",
    question: "Em que horário costuma assistir com mais frequência?",
    options: [
      { value: "morning", label: "Manhã" },
      { value: "afternoon", label: "Tarde" },
      { value: "night", label: "Noite" },
      { value: "dawn", label: "Madrugada" },
    ],
  },
];

const signupSteps = {
  method: {
    question: "Como você prefere criar sua conta?",
    options: [
      { value: "google", label: "Continuar com Google" },
      { value: "email", label: "Usar meu e-mail" },
    ],
  },
  email: { question: "Digite seu melhor e-mail:" },
  name: { question: "Como podemos te chamar?" },
  password: { question: "Crie uma senha segura:" },
};

interface SignupData {
  email: string;
  name: string;
  password: string;
}

export function HomeChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [signupData, setSignupData] = useState<Partial<SignupData>>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [currentSignupStep, setCurrentSignupStep] = useState<
    keyof typeof signupSteps | null
  >(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    // Initial welcome message
    setTimeout(() => {
      setMessages([
        {
          id: "0",
          text: "Olá! Eu sou o Filmin.AI, sua inteligência recomendadora de filmes e séries. Posso te ajudar a escolher algo incrível hoje? Vamos lá!",
          sender: "ai",
        },
      ]);
      setTimeout(() => addNextQuestion(0), 1000);
    }, 500);
  }, []);

  const addNextQuestion = (step: number) => {
    if (step >= chatSteps.length) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "Já tenho uma recomendação perfeita para você! 🎬\n\nPara liberar sua recomendação personalizada, crie sua conta gratuita em segundos:",
          sender: "ai",
          options: signupSteps.method.options,
          currentStep: -1,
        },
      ]);
      setCurrentSignupStep("method");
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: chatSteps[step].question,
        sender: "ai",
        options: chatSteps[step].options,
        currentStep: step,
      },
    ]);
    setCurrentStep(step);
  };

  const handleAnswer = (value: string, step: number) => {
    const currentStep = chatSteps[step];

    if (currentStep.multiSelect) {
      const currentAnswers = answers[currentStep.id] || [];
      const updatedAnswers = currentAnswers.includes(value)
        ? currentAnswers.filter((v: string) => v !== value)
        : [...currentAnswers, value];

      setAnswers((prev) => ({ ...prev, [currentStep.id]: updatedAnswers }));

      if (value === "continue") {
        const selectedLabels = updatedAnswers
          .map(
            (ans) => currentStep.options.find((opt) => opt.value === ans)?.label
          )
          .filter(Boolean);

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: `São esses: ${selectedLabels.join(", ")}`,
            sender: "user",
            selectionStep: step,
          },
        ]);

        setTimeout(() => addNextQuestion(step + 1), 500);
        return;
      }

      // Only show continue button when there are selections
      if (updatedAnswers.length > 0) {
        const continueMessageExists = messages.some(
          (m) => m.id === `continue-${step}`
        );
        if (!continueMessageExists) {
          setMessages((prev) => [
            ...prev,
            {
              id: `continue-${step}`,
              text: "Ótimo! Clique em continuar quando estiver pronto.",
              sender: "ai",
              options: [
                {
                  value: "continue",
                  label: "Continuar",
                },
              ],
              currentStep: step,
            },
          ]);
        }
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== `continue-${step}`));
      }
    } else {
      // Original single-select logic
      const selectedOption = currentStep.options.find(
        (opt) => opt.value === value
      );
      setAnswers((prev) => ({ ...prev, [currentStep.id]: value }));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: selectedOption?.label || value,
          sender: "user",
        },
      ]);
      setTimeout(() => addNextQuestion(step + 1), 500);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSignupStep = async (value: string) => {
    if (currentSignupStep === "method") {
      if (value === "google") {
        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/dashboard`,
            },
          });

          if (error) throw error;

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text: "Ótimo! Redirecionando para o login com Google...",
              sender: "ai",
            },
          ]);
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text: "Ops! Algo deu errado. Tente novamente ou use seu e-mail.",
              sender: "ai",
              options: signupSteps.method.options,
            },
          ]);
        }
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: signupSteps.email.question,
          sender: "ai",
          requiresInput: true,
        },
      ]);
      setCurrentSignupStep("email");
      return;
    }

    if (currentSignupStep === "email") {
      if (!value.includes("@") || !value.includes(".")) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: "Por favor, digite um e-mail válido.",
            sender: "ai",
            requiresInput: true,
          },
        ]);
        return;
      }

      try {
        const { data } = await supabase.functions.invoke("check-email", {
          body: { email: value },
        });

        if (data?.exists) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text: value,
              sender: "user",
            },
            {
              id: Date.now().toString() + "1",
              text: "Parece que você já tem uma conta! Vamos te redirecionar para o login...",
              sender: "ai",
            },
          ]);

          setTimeout(() => {
            window.location.href = "/signup";
          }, 5000);
          return;
        }

        setSignupData((prev) => ({ ...prev, email: value }));
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: value,
            sender: "user",
          },
          {
            id: Date.now().toString() + "1",
            text: signupSteps.name.question,
            sender: "ai",
            requiresInput: true,
          },
        ]);
        setCurrentSignupStep("name");
        return;
      } catch (error) {}
    }

    if (currentSignupStep === "name") {
      if (value.length < 2) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: "Por favor, digite um nome válido.",
            sender: "ai",
            requiresInput: true,
          },
        ]);
        return;
      }

      setSignupData((prev) => ({ ...prev, name: value }));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: value,
          sender: "user",
        },
        {
          id: Date.now().toString() + "1",
          text: signupSteps.password.question,
          sender: "ai",
          requiresInput: true,
          isPassword: true,
        },
      ]);
      setCurrentSignupStep("password");
      return;
    }

    if (currentSignupStep === "password") {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: signupData.email!,
          password: value,
          options: {
            data: {
              name: signupData.name,
              // Store onboarding answers in user metadata
              onboarding: {
                genres: answers["favorite-genres"],
                content_type: answers["content-preference"],
                languages: ["any"],
                watch_duration: answers["watch-duration"],
                watch_time: answers["watch-time"],
              }
            },
          },
        });

        if (error) throw error;

        // Save onboarding data to localStorage for later use
        localStorage.setItem('onboarding_data', JSON.stringify({
          genres: answers["favorite-genres"],
          content_type: answers["content-preference"],
          languages: ["any"],
          watch_duration: answers["watch-duration"],
          watch_time: answers["watch-time"],
          user_id: data.user!.id
        }));

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: "Cadastro realizado com sucesso! Verifique seu e-mail para confirmar sua conta. Após confirmar, faça login para continuar.",
            sender: "ai",
          },
        ]);

      } catch (error: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: error.message || "Erro ao criar conta. Tente novamente.",
            sender: "ai",
            requiresInput: true,
            isPassword: true,
          },
        ]);
      }
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 w-full max-w-[800px] mx-auto">
      <div className="p-4 border-b border-white/10 flex items-center gap-2">
        <Bot className="w-5 h-5 text-filmeja-purple" />
        <h3 className="text-lg font-semibold text-white">Filmin.AI te ajuda</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start gap-2 max-w-[80%] ${
                  message.sender === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === "user"
                      ? "bg-filmeja-purple"
                      : "bg-filmeja-blue"
                  }`}
                >
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div
                  className={`p-4 rounded-xl ${
                    message.sender === "user"
                      ? "bg-filmeja-purple text-white"
                      : "bg-white/10 text-white"
                  }`}
                >
                  <p className="whitespace-pre-line">{message.text}</p>

                  {message.options && (
                    <div className="mt-4 space-y-2">
                      {/* Custom layout for favorite-genres: 2 columns per row */}
                      {message.currentStep !== undefined &&
                        chatSteps[message.currentStep]?.id === "favorite-genres" ? (
                        <div className="grid grid-cols-2 gap-2">
                          {message.options.map((option) => {
                            const isSelected =
                              message.currentStep !== undefined &&
                              chatSteps[message.currentStep]?.multiSelect &&
                              (
                                answers[chatSteps[message.currentStep].id] || []
                              ).includes(option.value);

                            return (
                              <Button
                                key={option.value}
                                onClick={() =>
                                  message.currentStep >= 0
                                    ? handleAnswer(
                                        option.value,
                                        message.currentStep
                                      )
                                    : handleSignupStep(option.value)
                                }
                                className={`w-full justify-start text-left ${
                                  isSelected
                                    ? "bg-filmeja-purple text-white hover:bg-filmeja-purple/90"
                                    : "bg-white/5 hover:bg-white/10 text-white"
                                }`}
                                variant="ghost"
                              >
                                {option.label}
                              </Button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-4 space-y-2">
                          {message.options.map((option) => {
                            const isSelected =
                              message.currentStep !== undefined &&
                              chatSteps[message.currentStep]?.multiSelect &&
                              (
                                answers[chatSteps[message.currentStep].id] || []
                              ).includes(option.value);

                            return (
                              <Button
                                key={option.value}
                                onClick={() =>
                                  message.currentStep >= 0
                                    ? handleAnswer(
                                        option.value,
                                        message.currentStep
                                      )
                                    : handleSignupStep(option.value)
                                }
                                className={`w-full justify-start text-left ${
                                  isSelected
                                    ? "bg-filmeja-purple text-white hover:bg-filmeja-purple/90"
                                    : "bg-white/5 hover:bg-white/10 text-white"
                                }`}
                                variant="ghost"
                              >
                                {/* Add Google icon for the Google signup option */}
                                {option.value === "google" && (
                                  <img src="/google.png" alt="Google" className="w-5 h-5 mr-2" />
                                )}
                                {option.label}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {message.requiresInput && (
                    <div className="mt-4">

                      <Input
                        key={`input-${message.id}-${currentSignupStep}`}
                        type={message.isPassword ? "password" : "text"}
                        value={inputValues[message.id] || ""}
                        onChange={(e) => setInputValues(prev => ({ ...prev, [message.id]: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && inputValues[message.id]?.trim()) {
                            handleSignupStep(inputValues[message.id]);
                            setInputValues(prev => ({ ...prev, [message.id]: "" }));
                          }
                        }}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder={message.isPassword ? "********" : "Digite aqui..."}
                      />
                      <Button
                        className="mt-2 w-full bg-filmeja-purple hover:bg-filmeja-purple/90"
                        onClick={() => {
                          if (inputValues[message.id]?.trim()) {
                            handleSignupStep(inputValues[message.id]);
                            setInputValues(prev => ({ ...prev, [message.id]: "" }));
                          }
                        }}
                      >
                        Continuar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
