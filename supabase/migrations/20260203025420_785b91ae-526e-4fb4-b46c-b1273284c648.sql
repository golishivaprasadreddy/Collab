-- Add unique constraint on typing_indicators for upsert functionality
ALTER TABLE public.typing_indicators 
ADD CONSTRAINT typing_indicators_user_collab_unique 
UNIQUE (collaboration_request_id, user_id);