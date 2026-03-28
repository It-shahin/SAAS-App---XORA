const StyleOptions = ({
  titleColor, setTitleColor,
  textColor, setTextColor,
  titleSize, setTitleSize,
  textSize, setTextSize,
  titleAlign, setTitleAlign,
  descriptionAlign, setDescriptionAlign,
  textVertical, setTextVertical,
  backgroundMode, setBackgroundMode,
  backgroundColor, setBackgroundColor,
  backgroundAssetType, setBackgroundAssetType,
  backgroundAssetUrl, setBackgroundAssetUrl,
  musicUrl, setMusicUrl,
  assets,
  assetLoading,
  assetPickerOpen, setAssetPickerOpen,
  handleBackgroundUpload,
}) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
    <p className="text-gray-400 text-xs uppercase tracking-widest">Style &amp; Options</p>

    {/* Colors */}
    <div className="flex flex-wrap gap-6">
      {[['Title Color', titleColor, setTitleColor], ['Text Color', textColor, setTextColor]].map(([label, val, setter]) => (
        <div key={label} className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs">{label}</label>
          <div className="flex items-center gap-2">
            <input type="color" value={val} onChange={(e) => setter(e.target.value)}
              className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
            <span className="text-gray-500 text-xs font-mono">{val}</span>
          </div>
        </div>
      ))}
    </div>

    {/* Font sizes */}
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-gray-400 text-xs">Title Size — {titleSize}px</label>
        <input type="range" min={28} max={96} value={titleSize}
          onChange={(e) => setTitleSize(Number(e.target.value))}
          className="accent-indigo-500" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-gray-400 text-xs">Text Size — {textSize}px</label>
        <input type="range" min={18} max={72} value={textSize}
          onChange={(e) => setTextSize(Number(e.target.value))}
          className="accent-indigo-500" />
      </div>
    </div>

    {/* Alignment */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[
        ['Title Align', titleAlign, setTitleAlign],
        ['Description Align', descriptionAlign, setDescriptionAlign],
        ['Vertical Position', textVertical, setTextVertical, ['top', 'center', 'bottom']],
      ].map(([label, val, setter, opts = ['left', 'center', 'right']]) => (
        <div key={label} className="flex flex-col gap-2">
          <label className="text-gray-400 text-xs">{label}</label>
          <div className="flex gap-2">
            {opts.map((a) => (
              <button key={a} type="button" onClick={() => setter(a)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${
                  val === a ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/10 text-gray-400 hover:border-indigo-500/50'
                }`}>{a}</button>
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Background */}
    <div className="flex flex-col gap-3">
      <label className="text-gray-400 text-xs">Background</label>
      <div className="flex gap-3">
        {['none', 'color', 'asset'].map((m) => (
          <button key={m} type="button" onClick={() => setBackgroundMode(m)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all capitalize ${
              backgroundMode === m ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/10 text-gray-400 hover:border-indigo-500/50'
            }`}>{m}</button>
        ))}
      </div>

      {backgroundMode === 'color' && (
        <div className="flex items-center gap-3">
          <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
          <span className="text-gray-400 text-sm font-mono">{backgroundColor}</span>
        </div>
      )}

      {backgroundMode === 'asset' && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            {['image', 'video'].map((t) => (
              <button key={t} type="button" onClick={() => setBackgroundAssetType(t)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all capitalize ${
                  backgroundAssetType === t ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/10 text-gray-400 hover:border-indigo-500/50'
                }`}>{t}</button>
            ))}
          </div>
          <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:border-indigo-500/50 transition-colors">
            <span className="text-gray-400 text-sm">{assetLoading ? 'Uploading...' : 'Upload background file'}</span>
            <input type="file" accept="image/*,video/*" onChange={handleBackgroundUpload} className="hidden" />
          </label>
          {assets.length > 0 && (
            <div>
              <button type="button" onClick={() => setAssetPickerOpen(!assetPickerOpen)}
                className="text-indigo-400 text-sm hover:underline">
                {assetPickerOpen ? 'Hide saved assets' : 'Pick from saved assets'}
              </button>
              {assetPickerOpen && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {assets.map((asset) => (
                    <button key={asset.$id} type="button"
                      onClick={() => { setBackgroundAssetUrl(asset.url); setAssetPickerOpen(false) }}
                      className={`rounded-xl overflow-hidden border-2 transition-all ${
                        backgroundAssetUrl === asset.url ? 'border-indigo-500' : 'border-white/10 hover:border-indigo-500/50'
                      }`}>
                      <img src={asset.url} alt={asset.name} className="w-full h-16 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {backgroundAssetUrl && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-2">Selected background preview</p>
              {backgroundAssetType === 'video' ? (
                <video src={backgroundAssetUrl} className="w-full h-28 rounded-lg object-cover" controls />
              ) : (
                <img src={backgroundAssetUrl} alt="Selected background" className="w-full h-28 rounded-lg object-cover" />
              )}
              <button
                type="button"
                onClick={() => setBackgroundAssetUrl('')}
                className="mt-2 text-xs text-red-400 hover:text-red-300"
              >
                Remove selected asset
              </button>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Music */}
    <div className="flex flex-col gap-2">
      <label className="text-gray-400 text-xs">Background Music URL (optional)</label>
      <input type="text" value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)}
        placeholder="https://..."
        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
    </div>
  </div>
)

export default StyleOptions
