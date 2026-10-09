import os

with open("web/app/home/page.tsx", "r") as f:
    content = f.read()

content = content.replace("fetchAPI('/overview').then(setData).catch(console.error);", """
fetchAPI('/overview').then(setData).catch(err => {
    console.error(err);
    if (typeof window !== "undefined") {
        window.location.href = "/login";
    }
});
""")

with open("web/app/home/page.tsx", "w") as f:
    f.write(content)

with open("web/app/medications/page.tsx", "r") as f:
    content = f.read()

content = content.replace("fetchAPI('/medications/reconciled').then(data => {", """
fetchAPI('/medications/reconciled').then(data => {
""")
content = content.replace("}).catch(console.error);", """
}).catch(err => {
    console.error(err);
    if (typeof window !== "undefined") {
        window.location.href = "/login";
    }
});
""")

with open("web/app/medications/page.tsx", "w") as f:
    f.write(content)

print("Added redirects")
