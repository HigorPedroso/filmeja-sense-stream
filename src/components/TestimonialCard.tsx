
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Star } from 'lucide-react';

interface TestimonialProps {
  name: string;
  quote: string;
  rating: number;
  image?: string;
}

const TestimonialCard: React.FC<TestimonialProps> = ({ name, quote, rating, image }) => {
  return (
    <Card className="bg-black/40 backdrop-blur-sm border border-white/10 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          {image && (
            <div className="relative h-12 w-12 rounded-full overflow-hidden">
              <AspectRatio ratio={1} className="bg-filmeja-purple/20">
                <img
                  src={image}
                  alt={name}
                  className="object-cover h-full w-full rounded-full"
                />
              </AspectRatio>
            </div>
          )}
          <div>
            <h4 className="font-bold text-white">{name}</h4>
            <div className="flex text-filmeja-purple mt-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${i < rating ? 'fill-filmeja-purple' : 'fill-transparent text-filmeja-gray'}`}
                />
              ))}
            </div>
          </div>
        </div>
        <p className="text-gray-300 italic">&ldquo;{quote}&rdquo;</p>
      </CardContent>
    </Card>
  );
};

export default TestimonialCard;
