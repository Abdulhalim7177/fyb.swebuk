-- Update existing student roles from 'Student' to 'student'
UPDATE profiles 
SET role = 'student' 
WHERE role = 'Student';

-- Update the handle_new_user function to use lowercase 'student'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
declare
  user_count integer;
begin
  select count(*) into user_count from auth.users;
  if user_count = 1 then
    insert into public.profiles (id, full_name, avatar_url, role)
    values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'admin');
  else
    insert into public.profiles (id, full_name, avatar_url, role)
    values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'student');
  end if;
  return new;
end;
$$ language plpgsql security definer;