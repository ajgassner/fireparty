package at.agsolutions.fireparty.domain;

import at.agsolutions.fireparty.util.TimeUtil;
import org.junit.BeforeClass;
import org.junit.Test;

import java.time.format.DateTimeFormatter;
import java.util.Objects;

import static org.junit.Assert.*;

public class PartyHourTest {

	private static PartyHour[] h;

	@BeforeClass
	public static void setup() {
		h = TimeUtil.getHours();
	}

	@Test
	public void testEquals() throws Exception {
		PartyHour first = new PartyHour(12);
		PartyHour second = new PartyHour(12);
		PartyHour third = new PartyHour(5);

		assertEquals(first, second);
		assertEquals(second, first);
		assertNotEquals(first, third);
		assertNotEquals(second, third);
	}

	@Test
	public void testHashCode() throws Exception {
		assertEquals(Objects.hash(6), new PartyHour(6).hashCode());
	}

	@Test
	public void testCompareTo() throws Exception {
		assertEquals(1, new PartyHour(3).compareTo(new PartyHour(2)));
		assertEquals(0, new PartyHour(3).compareTo(new PartyHour(3)));
		assertEquals(-1, new PartyHour(3).compareTo(new PartyHour(4)));
	}

	@Test
	public void testToString() throws Exception {
		assertEquals("15:00", new PartyHour(15).toString());
	}

	@Test
	public void testIsBefore() throws Exception {
		assertTrue(h[21].isBefore(h[3]));
		assertTrue(h[3].isBefore(h[4]));
		assertTrue(h[20].isBefore(h[22]));
		assertTrue(h[12].isBefore(h[6]));

		assertFalse(h[3].isBefore(h[21]));
		assertFalse(h[4].isBefore(h[3]));
		assertFalse(h[22].isBefore(h[20]));
		assertFalse(h[6].isBefore(h[12]));
	}

	@Test
	public void testIsAfter() throws Exception {
		assertFalse(h[21].isAfter(h[3]));
		assertFalse(h[3].isAfter(h[4]));
		assertFalse(h[20].isAfter(h[22]));
		assertFalse(h[12].isAfter(h[6]));

		assertTrue(h[3].isAfter(h[21]));
		assertTrue(h[4].isAfter(h[3]));
		assertTrue(h[22].isAfter(h[20]));
		assertTrue(h[6].isAfter(h[12]));
	}

	@Test
	public void testIsMorning() throws Exception {
		assertTrue(h[0].isMorning());
		assertTrue(h[3].isMorning());
		assertTrue(h[6].isMorning());

		assertFalse(h[12].isMorning());
		assertFalse(h[23].isMorning());
		assertFalse(h[9].isMorning());	}

	@Test
	public void testFormat() throws Exception {
		assertEquals("15:00:00", new PartyHour(15).format(DateTimeFormatter.ISO_TIME));
		assertEquals("20:00", new PartyHour(20).format(PartyHour.FORMATTER));
	}

	@Test
	public void testGetHour() throws Exception {
		assertEquals(5, new PartyHour(5).getHour());
	}

	@Test
	public void testAddHours() {
		PartyHour hour = new PartyHour(23).addHours(3);
		assertEquals(2, hour.getHour());

		hour = new PartyHour(23).addHours(24);
		assertEquals(23, hour.getHour());

		hour = new PartyHour(0).addHours(48);
		assertEquals(0, hour.getHour());

		hour = new PartyHour(5).addHours(-12);
		assertEquals(5, hour.getHour());
	}
}