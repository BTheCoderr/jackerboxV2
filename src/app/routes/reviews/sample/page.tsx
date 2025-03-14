'use client';

import { useState } from 'react';
import { ReviewList } from '@/components/reviews/review-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sample review data
const sampleReviews = [
  {
    id: '1',
    rating: 5,
    comment: 'This equipment was fantastic! It was in perfect condition and worked exactly as described. The owner was very helpful and responsive. I would definitely rent from them again.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    author: {
      id: 'user1',
      name: 'John Smith',
      image: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    ownerResponse: 'Thank you for your kind review! It was a pleasure renting to you and I look forward to working with you again in the future.',
    ownerResponseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    helpfulVotes: 12,
    unhelpfulVotes: 1,
    userVote: true,
  },
  {
    id: '2',
    rating: 4,
    comment: 'The equipment was good overall, but there were a few minor issues. The battery didn\'t last as long as I expected, but it wasn\'t a major problem. The owner was responsive and helpful when I reached out with questions.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    author: {
      id: 'user2',
      name: 'Sarah Johnson',
      image: 'https://randomuser.me/api/portraits/women/2.jpg',
    },
    ownerResponse: null,
    ownerResponseDate: null,
    helpfulVotes: 8,
    unhelpfulVotes: 2,
    userVote: null,
  },
  {
    id: '3',
    rating: 2,
    comment: 'I was disappointed with this rental. The equipment had several scratches that weren\'t mentioned in the listing, and it didn\'t perform as well as I expected. The owner was slow to respond to my messages.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    author: {
      id: 'user3',
      name: 'Michael Brown',
      image: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
    ownerResponse: 'I apologize for your experience. I wasn\'t aware of the scratches and will update the listing. I was traveling with limited internet access which affected my response time. I\'ve addressed the performance issues you mentioned.',
    ownerResponseDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
    helpfulVotes: 15,
    unhelpfulVotes: 3,
    userVote: false,
  },
  {
    id: '4',
    rating: 5,
    comment: 'Absolutely perfect rental experience! The equipment was in pristine condition and performed even better than I expected. The owner provided detailed instructions and was very accommodating with pickup and drop-off times. This is exactly what the Jackerbox platform should be about - connecting people with quality equipment and excellent service. I\'ve already recommended this owner to several colleagues who need similar equipment for upcoming projects.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    author: {
      id: 'user4',
      name: 'Emily Davis',
      image: 'https://randomuser.me/api/portraits/women/4.jpg',
    },
    ownerResponse: null,
    ownerResponseDate: null,
    helpfulVotes: 20,
    unhelpfulVotes: 0,
    userVote: true,
  },
  {
    id: '5',
    rating: 3,
    comment: 'Average experience. The equipment worked fine but wasn\'t as clean as I expected. Pickup and drop-off were smooth.',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    author: {
      id: 'user5',
      name: 'David Wilson',
      image: null,
    },
    ownerResponse: 'Thank you for your feedback. I\'ll make sure to thoroughly clean the equipment before future rentals.',
    ownerResponseDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    helpfulVotes: 5,
    unhelpfulVotes: 1,
    userVote: null,
  },
];

export default function SampleReviewsPage() {
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('owner1');

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Review System Demo</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Review System Features</CardTitle>
          <CardDescription>
            Explore the features of our enhanced review and rating system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Star ratings with detailed reviews</li>
            <li>Owner responses to customer feedback</li>
            <li>Helpfulness voting to highlight valuable reviews</li>
            <li>Expandable long reviews for better readability</li>
            <li>Timestamps showing when reviews and responses were posted</li>
          </ul>
        </CardContent>
      </Card>
      
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Sample Reviews</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">View as:</span>
          <Button 
            variant={isOwner ? "outline" : "default"} 
            onClick={() => setIsOwner(false)}
            size="sm"
          >
            Customer
          </Button>
          <Button 
            variant={isOwner ? "default" : "outline"} 
            onClick={() => setIsOwner(true)}
            size="sm"
          >
            Equipment Owner
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="positive">Positive (4-5★)</TabsTrigger>
          <TabsTrigger value="neutral">Neutral (3★)</TabsTrigger>
          <TabsTrigger value="negative">Negative (1-2★)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <ReviewList 
            reviews={sampleReviews} 
            isOwner={isOwner} 
            currentUserId={currentUserId} 
          />
        </TabsContent>
        
        <TabsContent value="positive">
          <ReviewList 
            reviews={sampleReviews.filter(r => r.rating >= 4)} 
            isOwner={isOwner} 
            currentUserId={currentUserId} 
          />
        </TabsContent>
        
        <TabsContent value="neutral">
          <ReviewList 
            reviews={sampleReviews.filter(r => r.rating === 3)} 
            isOwner={isOwner} 
            currentUserId={currentUserId} 
          />
        </TabsContent>
        
        <TabsContent value="negative">
          <ReviewList 
            reviews={sampleReviews.filter(r => r.rating <= 2)} 
            isOwner={isOwner} 
            currentUserId={currentUserId} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 