import { useState, useEffect } from 'react';

const useTypewriter = (texts: string[], typingSpeed = 100, delayBetweenTexts = 3000) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const type = () => {
      const fullText = texts[currentTextIndex];
      
      if (!isDeleting) {
        if (currentText.length < fullText.length) {
          setCurrentText(fullText.slice(0, currentText.length + 1));
          timeout = setTimeout(type, typingSpeed);
        } else {
          timeout = setTimeout(() => setIsDeleting(true), delayBetweenTexts);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(fullText.slice(0, currentText.length - 1));
          timeout = setTimeout(type, typingSpeed / 2);
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((current) => (current + 1) % texts.length);
        }
      }
    };

    timeout = setTimeout(type, typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, currentTextIndex, isDeleting, texts, typingSpeed, delayBetweenTexts]);

  return currentText;
};

export default useTypewriter;