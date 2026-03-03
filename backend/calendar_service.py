import os
import datetime
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json

# Scopes required for the API
SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_client_config():
    """Constructs client config from environment variables."""
    return {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost:8000/auth/google/callback"]
        }
    }

def get_google_auth_url():
    """Generates the authorization URL manually to avoid PKCE (Missing code verifier error)."""
    config = get_client_config()["web"]
    client_id = config["client_id"]
    redirect_uri = config["redirect_uris"][0]
    scope = "+".join(SCOPES)
    state = os.urandom(16).hex()
    
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope={scope}&"
        f"access_type=offline&"
        f"include_granted_scopes=true&"
        f"state={state}&"
        f"prompt=consent"
    )
    return auth_url, state

def exchange_code_for_token(code):
    """Exchanges the authorization code for tokens."""
    config = get_client_config()
    flow = Flow.from_client_config(
        config,
        scopes=SCOPES,
        redirect_uri="http://localhost:8000/auth/google/callback"
    )
    flow.fetch_token(code=code)
    creds = flow.credentials
    return json.loads(creds.to_json())

def get_calendar_service(creds_json):
    """Builds and returns the Calendar service."""
    creds = Credentials.from_authorized_user_info(creds_json, SCOPES)
    return build('calendar', 'v3', credentials=creds)

def sync_tasks(tasks, creds_json):
    """
    Syncs a list of tasks to Google Calendar.
    Returns a dictionary mapping task_id -> google_event_id for new/updated events.
    """
    service = get_calendar_service(creds_json)
    synced_events = {}

    for task in tasks:
        # Construct event details
        summary = f"Study: {task['subject_name']} - {task['topic']}"
        description = f"Topic: {task['topic']}"
        start_date = task['scheduled_date'].strftime('%Y-%m-%d')
        end_date = task['scheduled_date'].strftime('%Y-%m-%d') # All-day event for now

        event_body = {
            'summary': summary,
            'description': description,
            'start': {'date': start_date},
            'end': {'date': end_date}, # End date is exclusive for all-day events, so strictly this should be +1 day, but let's see. 
                                       # Actually for all-day, end must be next day.
        }
        
        # Adjust end date for all-day event
        start_dt = task['scheduled_date']
        end_dt = start_dt + datetime.timedelta(days=1)
        event_body['end']['date'] = end_dt.strftime('%Y-%m-%d')

        try:
            # If we had an existing event ID, we would update. 
            # For now, simplistic approach: Just insert. 
            # In a real app, we'd check if 'google_event_id' exists in the task dict.
            
            if task.get('google_event_id'):
                # Update existing
                event = service.events().update(
                    calendarId='primary',
                    eventId=task['google_event_id'],
                    body=event_body
                ).execute()
                synced_events[task['id']] = event['id']
            else:
                # Create new
                event = service.events().insert(
                    calendarId='primary',
                    body=event_body
                ).execute()
                synced_events[task['id']] = event['id']
                
        except HttpError as error:
            print(f"An error occurred: {error}")
            
    return synced_events

def move_event(google_event_id, new_date, creds_json):
    """
    Moves an existing Google Calendar event to a new date.
    Returns the updated event object or None if failed.
    """
    service = get_calendar_service(creds_json)
    
    try:
        # Get existing event to preserve other details
        event = service.events().get(calendarId='primary', eventId=google_event_id).execute()
        
        # Update dates
        start_date = new_date.strftime('%Y-%m-%d')
        end_date = (new_date + datetime.timedelta(days=1)).strftime('%Y-%m-%d')
        
        event['start'] = {'date': start_date}
        event['end'] = {'date': end_date}
        
        updated_event = service.events().update(
            calendarId='primary',
            eventId=google_event_id,
            body=event
        ).execute()
        
        return updated_event
        
    except HttpError as error:
        print(f"Failed to move event: {error}")
        return None

def get_user_email(creds_json):
    """Returns the email address (calendar ID) of the authenticated user."""
    service = get_calendar_service(creds_json)
    try:
        # primary calendar ID is the email address
        calendar = service.calendars().get(calendarId='primary').execute()
        return calendar['id']
    except HttpError as error:
        print(f"Failed to get user email: {error}")
        return None

def delete_event(google_event_id, creds_json):
    """
    Deletes a Google Calendar event.
    """
    service = get_calendar_service(creds_json)
    try:
        service.events().delete(calendarId='primary', eventId=google_event_id).execute()
        return True
    except HttpError as error:
        print(f"Failed to delete event: {error}")
        return False

def update_event_title(google_event_id, new_title, creds_json):
    """
    Updates the summary (title) of a Google Calendar event.
    """
    service = get_calendar_service(creds_json)
    try:
        # Get existing event
        event = service.events().get(calendarId='primary', eventId=google_event_id).execute()
        
        # Update summary
        event['summary'] = new_title
        
        updated_event = service.events().update(
            calendarId='primary',
            eventId=google_event_id,
            body=event
        ).execute()
        
        return updated_event
    except HttpError as error:
        print(f"Failed to update event title: {error}")
        return None
