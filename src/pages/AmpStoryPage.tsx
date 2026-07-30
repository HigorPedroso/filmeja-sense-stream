import { useParams } from 'react-router-dom';
import { AmpStory } from '../components/AmpStory';

export function AmpStoryPage() {
  const { slug } = useParams<{ slug: string }>();
  
  if (!slug) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white text-center p-4">
        <p>Story não encontrado.</p>
      </div>
    );
  }
  
  return <AmpStory slug={slug} />;
}