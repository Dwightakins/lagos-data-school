import { useState, useEffect } from "react";

export function useTypingEffect(
  words: string[],
  typeMs = 90,
  deleteMs = 48,
  pauseMs = 2200
) {
  const [text, setText] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && text === word) {
      t = setTimeout(() => setDeleting(true), pauseMs);
    } else if (deleting && text === "") {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % words.length);
    } else {
      t = setTimeout(
        () =>
          setText(
            deleting
              ? word.slice(0, text.length - 1)
              : word.slice(0, text.length + 1)
          ),
        deleting ? deleteMs : typeMs
      );
    }
    return () => clearTimeout(t);
  }, [text, deleting, wordIdx, words, typeMs, deleteMs, pauseMs]);

  return text;
}
