export const createDevSession = async (userId: string) => {
  try {
    const response = await fetch('/api/create-dev-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
      credentials: 'include' // Important for cookies
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Reload the page to reflect the new session
      window.location.reload();
    } else {
      console.error('Failed to create session:', result.error);
      alert('Failed to create session: ' + result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating dev session:', error);
    alert('Error creating dev session: ' + error);
    return { success: false, error: error };
  }
};