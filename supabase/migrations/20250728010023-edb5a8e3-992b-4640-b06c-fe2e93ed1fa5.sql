-- Create contact_submissions table for storing contact form data
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create newsletter_subscriptions table for storing email subscriptions
CREATE TABLE public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (these tables can be public for contact forms)
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anyone to insert contact submissions and newsletter subscriptions
CREATE POLICY "Anyone can submit contact forms" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.newsletter_subscriptions 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_contact_submissions_email ON public.contact_submissions(email);
CREATE INDEX idx_contact_submissions_submitted_at ON public.contact_submissions(submitted_at);
CREATE INDEX idx_newsletter_subscriptions_email ON public.newsletter_subscriptions(email);
CREATE INDEX idx_newsletter_subscriptions_subscribed_at ON public.newsletter_subscriptions(subscribed_at);