import React, { useRef, useEffect } from 'react';

interface TweetEmbedProps {
  tweetId: string;
}

/**
 * Embeds a Twitter/X tweet using the official widgets API
 */
const TweetEmbed: React.FC<TweetEmbedProps> = ({ tweetId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inject Twitter widget script if not present
    if (!document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
      const script = document.createElement('script');
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      document.body.appendChild(script);
    }

    const interval = setInterval(() => {
      const t = (window as any).twttr;
      if (t && t.widgets && containerRef.current && containerRef.current.innerHTML === '') {
        t.widgets.createTweet(tweetId, containerRef.current, {
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        });
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [tweetId]);

  return <div ref={containerRef} className="my-6 min-h-[150px] flex justify-center" />;
};

export default TweetEmbed;
