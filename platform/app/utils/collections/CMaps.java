package utils.collections;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class CMaps {

	public static NChainedMap<String, Object> map(String key, Object value) {
		NChainedMap<String,Object> result = new NChainedMap<String,Object>();
		result.put(key, value);
		return result;
	}
}
