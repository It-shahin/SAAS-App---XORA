const SharePanel = ({
  videoUrl,
  shareLoading,
  shareCopied,
  shareError,
  shareExpiryHours, setShareExpiryHours,
  sharePassword, setSharePassword,
  disableDownload, setDisableDownload,
  handleShare,
}) => (
  <div className="bg-white/5 border border-green-500/20 rounded-2xl p-6">
    <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Generated Video</p>
    <video controls className="w-full rounded-xl" src={videoUrl} />
    <div className="flex gap-3 mt-4 flex-wrap">
      <a href={videoUrl} download target="_blank" rel="noreferrer"
        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
        ⬇ Download
      </a>
      <button onClick={handleShare} disabled={shareLoading}
        className="border border-white/10 text-gray-400 hover:text-white px-5 py-2.5 rounded-xl text-sm transition-colors">
        {shareCopied ? '✅ Link Copied!' : shareLoading ? 'Generating...' : '🔗 Share'}
      </button>
    </div>
    {shareError && <p className="text-red-400 text-sm mt-2">{shareError}</p>}

    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs">Expires in</label>
        <select value={shareExpiryHours} onChange={(e) => setShareExpiryHours(Number(e.target.value))}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
          <option value={24}>24 hours</option>
          <option value={72}>3 days</option>
          <option value={168}>7 days</option>
          <option value={720}>30 days</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs">Password (optional)</label>
        <input type="text" value={sharePassword} onChange={(e) => setSharePassword(e.target.value)}
          placeholder="Leave blank for none"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none" />
      </div>
      <div className="flex items-end pb-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={disableDownload} onChange={(e) => setDisableDownload(e.target.checked)}
            className="accent-indigo-500" />
          <span className="text-gray-400 text-sm">Disable download</span>
        </label>
      </div>
    </div>
  </div>
)

export default SharePanel
