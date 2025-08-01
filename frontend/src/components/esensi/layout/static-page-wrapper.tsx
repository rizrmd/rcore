export const StaticPageWrapper = ({content, format="jsx" as string}) => {

    const renderContent = format == "jsx" ? content : content;
    return (
        <div className="flex flex-col justify-start items-center w-full">
        <div className="flex flex-col w-full py-6 px-6 max-w-[1200px] ">
            {renderContent}
        </div>
        </div>
    );
};

export default StaticPageWrapper;
