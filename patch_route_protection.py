with open("web/components/Shell.tsx", "r") as f:
    content = f.read()

protection_logic = """
  useEffect(() => {
    fetchAPI('/me').then(res => {
      if (res && res.user) {
        setUser(res.user);
        if (res.user.role === 'hospital_staff' && !pathname.startsWith('/hospital') && !pathname.startsWith('/shared')) {
           router.push('/hospital/dashboard');
        }
      }
    }).catch(err => {
      if (pathname !== '/login') {
        clearToken();
        router.push('/login');
      }
    });
  }, [pathname]);
"""

# Replace the existing fetchAPI('/me') useEffect
content = content.replace("""  useEffect(() => {
    fetchAPI('/me').then(res => {
      if (res && res.user) {
        setUser(res.user);
      }
    }).catch(err => {
      if (pathname !== '/login') {
        clearToken();
        router.push('/login');
      }
    });
  }, [pathname]);""", protection_logic)

with open("web/components/Shell.tsx", "w") as f:
    f.write(content)

