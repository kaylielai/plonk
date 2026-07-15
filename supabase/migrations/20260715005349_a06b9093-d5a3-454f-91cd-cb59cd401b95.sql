
alter table public.idea_participants
  add constraint idea_participants_profile_fk
  foreign key (user_id) references public.profiles(user_id) on delete cascade;

alter table public.group_members
  add constraint group_members_profile_fk
  foreign key (user_id) references public.profiles(user_id) on delete cascade;

alter table public.stamps
  add constraint stamps_owner_profile_fk
  foreign key (owner_user_id) references public.profiles(user_id) on delete cascade;
