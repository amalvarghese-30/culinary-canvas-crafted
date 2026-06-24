
CREATE POLICY "staff read all reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "staff update reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "staff delete reviews"
  ON public.reviews FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
