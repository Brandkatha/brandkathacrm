-- RLS Policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for leads table
CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads" ON leads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads" ON leads
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for followups table
CREATE POLICY "Users can view own followups" ON followups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own followups" ON followups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own followups" ON followups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own followups" ON followups
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for message_templates table
CREATE POLICY "Users can view own templates" ON message_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON message_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON message_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON message_templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for elementor_webhooks table
CREATE POLICY "Users can view own elementor webhooks" ON elementor_webhooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own elementor webhooks" ON elementor_webhooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own elementor webhooks" ON elementor_webhooks
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for facebook_leads table
CREATE POLICY "Users can view own facebook leads" ON facebook_leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own facebook leads" ON facebook_leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own facebook leads" ON facebook_leads
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for integration_settings table
CREATE POLICY "Users can view own integration settings" ON integration_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integration settings" ON integration_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integration settings" ON integration_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integration settings" ON integration_settings
  FOR DELETE USING (auth.uid() = user_id);
