-- Arregla la política de eliminación de notificaciones para que los usuarios puedan borrarlas
DROP POLICY IF EXISTS "Users cannot delete notifications" ON public.notifications;

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete own notifications" ON public.notifications IS 'Permite a los usuarios borrar sus propias notificaciones.';
