import re

with open("web/app/hospital/search/page.tsx", "r") as f:
    content = f.read()

content = content.replace('import { useDebounce } from "use-debounce";', "")

debounce_hook = """
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return [debouncedValue];
}
"""

content = content.replace("export default function PatientSearch() {", debounce_hook + "\nexport default function PatientSearch() {")

with open("web/app/hospital/search/page.tsx", "w") as f:
    f.write(content)
