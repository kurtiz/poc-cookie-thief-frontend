const Loading = () => {
    return (
        <div className="flex h-[70vh] items-center justify-center">
            <div className="animate-spin rounded-full border-b-2 border-blue-500 h-5 w-5 mr-3"/>
            <span className="text-lg font-semibold">Loading...</span>
        </div>
    );
};

export default Loading;