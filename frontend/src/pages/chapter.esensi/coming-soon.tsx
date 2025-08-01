export default () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-repeat bg-center" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Crect x='0' y='0' width='20' height='30' rx='2'/%3E%3Crect x='40' y='15' width='20' height='30' rx='2'/%3E%3Crect x='20' y='30' width='20' height='30' rx='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
               backgroundSize: '120px 120px'
             }}>
        </div>
        {/* Additional blur overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-black/20"></div>
      </div>
      
      {/* Floating Books Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-8 h-12 bg-gradient-to-b from-amber-400 to-orange-600 rounded-sm opacity-30 animate-pulse transform rotate-12"></div>
        <div className="absolute top-40 right-20 w-6 h-10 bg-gradient-to-b from-blue-400 to-blue-600 rounded-sm opacity-25 animate-pulse delay-1000 transform -rotate-6"></div>
        <div className="absolute bottom-32 left-1/4 w-7 h-11 bg-gradient-to-b from-green-400 to-emerald-600 rounded-sm opacity-20 animate-pulse delay-2000 transform rotate-45"></div>
        <div className="absolute bottom-20 right-1/3 w-5 h-9 bg-gradient-to-b from-purple-400 to-violet-600 rounded-sm opacity-30 animate-pulse delay-3000 transform -rotate-12"></div>
        <div className="absolute top-1/3 left-2/3 w-6 h-10 bg-gradient-to-b from-red-400 to-rose-600 rounded-sm opacity-25 animate-pulse delay-4000 transform rotate-24"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-8 px-4">
          {/* Coming Soon Text */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white tracking-wider">
              <span className="inline-block animate-pulse">C</span>
              <span className="inline-block animate-pulse delay-100">O</span>
              <span className="inline-block animate-pulse delay-200">M</span>
              <span className="inline-block animate-pulse delay-300">I</span>
              <span className="inline-block animate-pulse delay-400">N</span>
              <span className="inline-block animate-pulse delay-500">G</span>
              <span className="mx-4"></span>
              <span className="inline-block animate-pulse delay-600">S</span>
              <span className="inline-block animate-pulse delay-700">O</span>
              <span className="inline-block animate-pulse delay-800">O</span>
              <span className="inline-block animate-pulse delay-900">N</span>
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto"></div>
          </div>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Something amazing is in the works. Stay tuned for an incredible reading experience.
          </p>
          
          {/* Decorative elements */}
          <div className="flex justify-center space-x-4 mt-8">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
      
      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent"></div>
    </div>
  );
};
