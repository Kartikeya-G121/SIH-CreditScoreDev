import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { ChatbotModal } from './chatbot-modal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function FloatingChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-lg"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-8 w-8" />
              ) : (
                <MessageCircle className="h-8 w-8" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Ask Nidhi</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isOpen && <ChatbotModal isOpen={isOpen} onOpenChange={setIsOpen} />}
    </>
  );
}
