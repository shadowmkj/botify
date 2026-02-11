const ApidocPage = async () => {
    const apiEndpoints = [
        {
            method: "POST",
            endpoint: "http://botify.codenik.in/api/messages/send",
            body: {
                from: +917012749946,
                to: +918943025837,
                messageType: "text",
                content: "Hello  this is only test",
            },
        },
        {
            method: "POST",
            endpoint: "http://botify.codenik.in/api/messages/send",
            body: {
                from: +917012749946,
                to: +918943025837,
                messageType: "media",
                content: "Hello  this is only test",
                media: "File"
            },
        },
        // {
        //   method: "POST",
        //   endpoint: "http://botify.codenik.in/api/messages/send-message",
        //   description: "Header Name:x-api-key",
        //   body: {
        //     deviceId: "device_123",
        //     to: "+1234567890",
        //     message: "Hello from API",
        //     type: "text",
        //   },
        // },
    ];

    return (
        <div className="container mx-auto py-10">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">API Documentation</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {apiEndpoints.map((api, index) => (
                    <div
                        key={index}
                        className="border rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <span
                                className={`px-2 py-1 rounded text-sm font-medium ${api.method === "POST"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                            >
                                {api.method}
                            </span>
                            <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {api.endpoint}
                            </code>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Make sure to add x-api-key to headers for auth
                        </p>
                        <p>
                            x-api-key: YOUR_API_KEY
                        </p>

                        {api.body && (
                            <div>
                                <h3 className="text-sm font-medium mb-2">Request Body:</h3>
                                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
                                    <code>{JSON.stringify(api.body, null, 2)}</code>
                                </pre>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ApidocPage;
