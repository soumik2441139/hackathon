import sys
import multiprocessing

# Windows does not officially support POSIX fork.
# We globally monkey-patch Multiprocessing before `rq` initialized 
# to gracefully fallback to `spawn` contexts on local Windows machines.
if sys.platform == "win32":
    _original_get_context = multiprocessing.get_context
    def _patched_get_context(method=None):
        if method == "fork":
            return _original_get_context("spawn")
        return _original_get_context(method)
    multiprocessing.get_context = _patched_get_context
