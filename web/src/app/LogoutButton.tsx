"use client";
export default function LogoutButton() {
  return (
    <button
      className="text-left hover:underline"
      onClick={() => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          location.href = '/login';
        }
      }}
    >
      Logout
    </button>
  );
}


