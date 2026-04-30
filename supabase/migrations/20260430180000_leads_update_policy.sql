-- Allow tenant members to update leads belonging to their tenant
CREATE POLICY "Tenant members can update their leads"
ON public.leads FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_members.tenant_id = leads.tenant_id
    AND tenant_members.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_members.tenant_id = leads.tenant_id
    AND tenant_members.user_id = auth.uid()
  )
);
