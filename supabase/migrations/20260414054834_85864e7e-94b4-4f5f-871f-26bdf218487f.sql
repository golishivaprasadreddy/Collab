
-- Fix the send_push_on_notification function to handle missing http extension gracefully
CREATE OR REPLACE FUNCTION public.send_push_on_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Try to send push notification, but don't fail if the extension is not available
  BEGIN
    PERFORM net.http_post(
      url := 'https://dshmaxcfnnplamzbrflw.supabase.co/functions/v1/send-push-notification',
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'title', NEW.title,
        'body', NEW.body,
        'data', COALESCE(NEW.data, '{}'::jsonb),
        'tag', NEW.type
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzaG1heGNmbm5wbGFtemJyZmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNDY3OTQsImV4cCI6MjA4NDcyMjc5NH0.roN16aPiJE9fi7gwWW3fZx66n38RudxfO_tFxzi5l0c'
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Silently ignore if push notification fails (extension not available, network error, etc.)
    RAISE LOG 'Push notification failed for user %: %', NEW.user_id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;
