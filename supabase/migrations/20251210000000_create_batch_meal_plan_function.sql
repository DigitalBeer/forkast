-- Create atomic batch meal plan creation function
-- This function eliminates N+1 queries and provides transaction safety

create or replace function public.create_meal_plan_with_history(
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_planned_meals jsonb default '[]'::jsonb
) returns jsonb as $$
declare
  v_meal_plan_id bigint;
  v_result jsonb;
  v_planned_meal record;
  v_history_items jsonb := '[]'::jsonb;
begin
  -- Create meal plan
  insert into public.meal_plans (user_id, start_date, end_date)
  values (auth.uid(), p_start_date, p_end_date)
  returning id into v_meal_plan_id;
  
  -- Insert planned meals and prepare history items
  for v_planned_meal in 
    select 
      (elem->>'meal_id')::bigint as meal_id,
      elem->>'planned_for_date' as planned_for_date,
      elem->>'meal_type' as meal_type
    from jsonb_array_elements(p_planned_meals) as elem
  loop
    -- Insert planned meal
    insert into public.planned_meals (
      meal_plan_id,
      meal_id,
      planned_for_date,
      meal_type
    ) values (
      v_meal_plan_id,
      v_planned_meal.meal_id,
      v_planned_meal.planned_for_date,
      v_planned_meal.meal_type
    );
    
    -- Add to history items for batch insert
    v_history_items := v_history_items || jsonb_build_object(
      'meal_id', v_planned_meal.meal_id,
      'action_type', 'planned',
      'additional_data', jsonb_build_object(
        'date', v_planned_meal.planned_for_date,
        'meal_type', v_planned_meal.meal_type,
        'meal_plan_id', v_meal_plan_id
      )
    );
  end loop;
  
  -- Batch insert meal history records
  if jsonb_array_length(v_history_items) > 0 then
    insert into public.meal_history (user_id, meal_id, action_type, additional_data)
    select 
      auth.uid(),
      (elem->>'meal_id')::bigint,
      elem->>'action_type',
      elem->>'additional_data'
    from jsonb_array_elements(v_history_items) as elem;
  end if;
  
  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'meal_plan_id', v_meal_plan_id
  );
  
  return v_result;
  
exception
  when others then
    -- Return error details for debugging
    return jsonb_build_object(
      'success', false,
      'error', sqlerrm,
      'detail', sqlstate
    );
end;
$$ language plpgsql security definer SET search_path = public;

-- Grant execute permission to authenticated users
grant execute on function public.create_meal_plan_with_history to authenticated;
