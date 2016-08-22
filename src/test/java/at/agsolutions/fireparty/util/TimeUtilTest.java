package at.agsolutions.fireparty.util;

import at.agsolutions.fireparty.domain.PartyHour;
import org.junit.BeforeClass;
import org.junit.Test;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class TimeUtilTest {

	private static PartyHour[] h;

	@BeforeClass
	public static void setup() {
		h = TimeUtil.getHours();
	}

	@Test
	public void testIntersects() throws Exception {
		assertFalse(TimeUtil.intersects(h[1], h[2], h[2], h[3]));
		assertFalse(TimeUtil.intersects(h[18], h[20], h[22], h[2]));
		assertFalse(TimeUtil.intersects(h[22], h[0], h[0], h[4]));
		assertFalse(TimeUtil.intersects(h[15], h[16], h[16], h[17]));

		assertTrue(TimeUtil.intersects(h[1], h[3], h[2], h[4]));
		assertTrue(TimeUtil.intersects(h[22], h[2], h[0], h[2]));
		assertTrue(TimeUtil.intersects(h[0], h[6], h[4], h[5]));
		assertTrue(TimeUtil.intersects(h[20], h[22], h[21], h[23]));

		assertFalse(TimeUtil.intersects(h[22], h[20], h[21], h[23]));
		assertFalse(TimeUtil.intersects(h[2], h[22], h[1], h[0]));
		assertFalse(TimeUtil.intersects(h[2], h[22], h[0], h[1]));
	}
}