import { requireSeller } from '@/lib/auth';

export async function GET(request) {
  try {
    console.log('Testing authentication in API route...');

    const auth = await requireSeller(request);
    console.log('Auth result:', auth);

    if (!auth.authorized) {
      return Response.json({
        success: false,
        message: auth.message,
        user: auth.user
      });
    }

    return Response.json({
      success: true,
      message: 'Authentication working correctly',
      user: auth.user
    });

  } catch (error) {
    console.error('Auth test error:', error);
    return Response.json({
      success: false,
      message: 'Auth error',
      error: error.message
    });
  }
}
